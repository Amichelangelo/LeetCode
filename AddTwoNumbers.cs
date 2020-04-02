using System;
using System.Collections.Generic;
using System.Text;

namespace LeetCode
{
    static class AddTwoNumbers
    {
        public static List<int> AddList(List<int> l1, List<int> l2)
        {
            var l3 = l1.Count >= l2.Count ? l1.AddResult(l2) : l2.AddResult(l1);
            return l3;
        }

        public static List<int> AddResult(this List<int> list, List<int> l2)
        {
            //list.Reverse();
            //l2.Reverse();
            var listResult = new List<int>();
            var tmp = 0;
            var length2 = l2.Count;
            var length1 = list.Count;
            for (var i = 0; i < length2; i++)
            {
                var node = list[i] + l2[i] + tmp;
                if (node > 9)
                {
                    tmp = node / 10;
                    node = node % 10;
                }

                listResult.Add(node);
            }

            for (var i = length2; i < length1; i++)
            {
                var node = list[i] + tmp;
                if (node > 9)
                {
                    tmp = node / 10;
                    node = node % 10;
                }

                listResult.Add(node);
            }

            return listResult;
        }

    }


    //Definition for singly-linked list.

    public class ListNode
    {
        public int val;
        public ListNode next;
        private ListNode P;

        public ListNode(int x)
        {
            val = x;
        }
        public ListNode(int[] xs)
        {
            P = new ListNode(0);
            val = xs[0];
            next = P;
            var xx = new int[xs.Length - 1];
            Array.Copy(xs,1,xx,0,xx.Length);
            foreach (var i in xx)
            {
                P.val = i;
                P.next = new ListNode(0);
                P = P.next;
            }
        }
    }

    public static class Solution
    {
        public static ListNode AddTwoNumbers(ListNode l1, ListNode l2)
        {
            var result = new ListNode(0);
            var p = result;
            var node = 0;
            while (l1 != null && l2 != null)
            {
                node = l1.val + l2.val + node;
                p.next = new ListNode(node > 9 ? node % 10 : node);
                p = p.next;
                node /= 10;
                l1 = l1.next;
                l2 = l2.next;
            }

            while (l1 != null)
            {
                node = l1.val + node;
                p.next = new ListNode(node > 9 ? node % 10 : node);
                p = p.next;
                node /= 10;
                l1 = l1.next;
            }

            while (l2 != null)
            {
                node = l2.val + node;
                p.next = new ListNode(node > 9 ? node % 10 : node);
                p = p.next;
                node /= 10;
                l2 = l2.next;
            }

            if (node != 0)
            {
                p.next = new ListNode(node);
            }
            return result;
        }
    }
}
