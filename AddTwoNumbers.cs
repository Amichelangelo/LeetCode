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
            for (var i = 0; i<length2;i++)
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

}
